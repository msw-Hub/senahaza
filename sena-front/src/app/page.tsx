import Packages from "@/components/packagesList";

export default function HomePage() {
  //todo list
  //패키지 리스트 가져오기 /main/packages
  //가져온 패키지 리스트를 보여주기

  return (
    <div className="flex items-center justify-center h-screen">
      <Packages />
    </div>
  );
}
